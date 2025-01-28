"""
Push changed posts to archive.org
To use, modify:
1. BASEURL
2. Internet Archive API Key, get it at https://archive.org/account/s3.php
   and set them as SAVEPAGENOW_ACCESS_KEY and SAVEPAGENOW_SECRET_KEY environment variables.
   It's recommended to set them as repository secrets.
"""

import json
import os
import traceback
from typing import Final, Optional, TypedDict
import yaml
import requests

ROOTURL: Final[str] = "https://young-lord.github.io/"
POSTS_BASEURL: Final[str] = ROOTURL + "posts/"

# https://archive.org/details/spn-2-public-api-page-docs-2023-01-22
# https://github.com/palewire/savepagenow/blob/main/savepagenow/api.py MIT License
DEFAULT_USER_AGENT: Final[str] = (
    "savepagenow (https://github.com/Young-Lord/Young-Lord.github.io/blob/master/.github/workflows/save_page.py)"
)


class WaybackRuntimeError(Exception):
    """A generic error returned by the Wayback Machine."""

    pass


class BlockedByRobots(WaybackRuntimeError):
    """Raised when archive.org has been blocked by the site's robots.txt."""

    pass


class BadGateway(WaybackRuntimeError):
    """Raised when you receive a 502 bad gateway status code."""

    pass


class Unauthorized(WaybackRuntimeError):
    """Raised when you receive a 401 unauthorized status code."""

    pass


class Forbidden(WaybackRuntimeError):
    """Raised when you receive a 403 forbidden status code."""

    pass


class TooManyRequests(WaybackRuntimeError):
    """Raised when you have exceeded the throttle on request frequency."""

    pass


class UnknownError(WaybackRuntimeError):
    """Raised when you receive a 520 unknown status code."""

    pass


class WebArchiveReturn(TypedDict):
    url: str
    job_id: str


class WebArchiveReturnWithMessage(WebArchiveReturn):
    message: str


WebArchiveReturnWithMaybeMessage = WebArchiveReturnWithMessage | WebArchiveReturn


def capture(
    target_url: str,
    authenticate: bool = True,
    headers: Optional[dict] = None,
    data: Optional[dict] = None,
) -> WebArchiveReturnWithMaybeMessage:
    # Put together the URL that will save our request
    domain = "https://web.archive.org"
    request_url = domain + "/save"

    if headers is None:
        headers = {}
    user_headers = headers
    if data is None:
        data = {}
    user_data = data

    headers = {
        "User-Agent": DEFAULT_USER_AGENT,
        "Accept": "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
    }

    data = {
        "url": target_url,
    }
    data.update(user_data)

    # Access Keys for Internet Archive API
    # Get it at https://archive.org/account/s3.php
    if authenticate:
        access_key = os.getenv("SAVEPAGENOW_ACCESS_KEY")
        secret_key = os.getenv("SAVEPAGENOW_SECRET_KEY")
        try:
            assert access_key and secret_key
        except AssertionError:
            raise ValueError(
                "You must set SAVEPAGENOW_ACCESS_KEY and SAVEPAGENOW_SECRET_KEY environment variables to use the authenticate flag"
            )
        headers.update(
            {
                "Authorization": f"LOW {access_key}:{secret_key}",
            }
        )

    headers.update(user_headers)

    # Make the request
    response = requests.post(request_url, headers=headers, data=data)

    # If it has an error header, raise that.
    has_error_header = "X-Archive-Wayback-Runtime-Error" in response.headers
    if has_error_header:
        error_header = response.headers["X-Archive-Wayback-Runtime-Error"]
        if error_header == "RobotAccessControlException: Blocked By Robots":
            raise BlockedByRobots("archive.org returned blocked by robots.txt error")
        else:
            raise WaybackRuntimeError(error_header)

    # If it has an error code, raise that
    status_code = response.status_code
    if status_code == 401:
        raise Unauthorized("Your archive.org access key and/or secret is not valid")
    elif status_code == 403:
        raise Forbidden(response.headers)
    elif status_code == 429:
        traceback.print_exc()
        # raise TooManyRequests(response.headers)
    elif status_code == 502:
        raise BadGateway(response.headers)
    elif status_code == 520:
        raise UnknownError(response.headers)
    return response.json()


all_changed_files: list[str] = json.loads(os.environ["all_changed_files"])

if not all_changed_files:
    print("No blog post changed.")
    exit(0)

FILE_SUFFIX: Final[str] = ".md"
for file in all_changed_files:
    assert file.endswith(FILE_SUFFIX)
    # https://stackoverflow.com/a/34727830
    url: str = ""
    with open(file, "r", encoding="utf8") as f:
        front_matter = next(yaml.load_all(f, Loader=yaml.FullLoader))
    title: str = front_matter["title"]
    if file.startswith("_posts/"):
        slug: str = front_matter["slug"]
        url = POSTS_BASEURL + slug
    else:
        assert "/" not in file  # it must be in root dir
        url = ROOTURL + file.removesuffix(FILE_SUFFIX)

    ret = capture(
        url,
        data={
            "capture_outlinks": 1,
            "skip_first_archive": 1,
            "capture_screenshot": 1,
            "delay_wb_availability": 1,
        },
    )
    print(f'"{title}" ({url}):')
    if "message" in ret:
        print("\t" + ret["message"])
    else:
        print("\tno message (that means success)")
